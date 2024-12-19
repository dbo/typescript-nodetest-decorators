import { suite, test, type SuiteContext, type TestContext } from "node:test";

type AnyFunction<R = any> = (...args: any[]) => R;

interface WithTestDiag {
    /**
     * Verbose diagnostic added to test case per test context.
     */
    diagnostic?: string;
}

/**
 * TODO no clue how to derive this type from "node:test".
 */
export interface TestOptions extends WithTestDiag {
    concurrency?: number | boolean | undefined;
    only?: boolean | undefined;
    signal?: AbortSignal | undefined;
    skip?: boolean | string | undefined;
    timeout?: number | undefined;
    todo?: boolean | string | undefined;
    plan?: number | undefined;
}
export interface HookOptions extends WithTestDiag {
    signal?: AbortSignal | undefined;
    timeout?: number | undefined;
}

type SuiteCtor<T> = {
    new (context: SuiteContext): T;

    /**
     * Optional static options, e.g. per base class.
     */
    suiteOptions?: TestOptions;
};

/**
 * \@Suite decorator to mark a class for test execution.
 * The test class constructor gets the suite context as argument.
 */
export function Suite<T extends {}, CtorT extends SuiteCtor<T>>(ctor: CtorT) {
    suiteOn({}, ctor);
}

/**
 * \@Suite decorator to mark a class for test execution providing suite() options.
 * The test class constructor gets the suite context as argument.
 */
export function SuiteWithOptions<T extends {}, CtorT extends SuiteCtor<T>>(options?: TestOptions) {
    return function SuiteWithOptions(ctor: CtorT) {
        suiteOn(options, ctor);
    };
}

/**
 * \@ParameterizedSuite decorator to mark a parameterized class for test execution.
 * The test class constructor gets the suite context as argument.
 * For improved naming checks of the given property names, the corresponding properties are required
 * on the class definition.
 */
export function ParameterizedSuite<T extends {}, CtorT extends SuiteCtor<T>>(args?: {
    /**
     * Properties that should be set on each run.
     */
    properties?: (keyof T)[];
    /**
     * Property values to use on each run, either direct values customized run with name/options.
     * Options are overriding any options given per suite resp. suiteOptions.
     * @attention each sub array resp. values array is required to have the exact
     * same number of values as defined per `properties`.
     */
    propertyValues?: (
        | any[]
        | {
              options: TestOptions;
              values: any[];
          }
    )[];
    /**
     * Test options to pass when running suite.
     */
    options?: TestOptions;
}) {
    return function ParameterizedSuite(ctor: CtorT) {
        const { options, properties = [], propertyValues: params = [[]] } = args || {};
        params.forEach((run, i) => {
            let values: any[];
            let runOptions = options;

            if (Array.isArray(run)) {
                values = run;
            } else {
                values = run.values;
                runOptions = {
                    ...options,
                    ...run.options,
                };
            }

            if (values.length !== properties.length) {
                throw new Error(
                    `@ParameterizedSuite: Use exact number of values at position ${i} for parameterized fields: [${properties}].`,
                );
            }
            const runParams = Object.fromEntries(properties.map((f, i) => [f, values[i]]));
            suiteOn(runOptions, ctor, `${ctor.name} #${i}`, runParams);
        });
    };
}

type TDecoratorType = "before" | "beforeEach" | "after" | "afterEach" | "test";

type TDecoratorEntry = {
    type: TDecoratorType;
    name: string;
    options?: TestOptions | HookOptions;
};

const instanceRel = new WeakMap<
    {},
    // Maps follows insertion order: base class hooks before sub class hooks
    Map<AnyFunction, TDecoratorEntry>
>();

/**
 * A decorator for marking a method to be executed before all test cases in a test suite.
 * This method will run once before any test cases are executed.
 *
 * @attention Be aware that this decorator hooks into the initializer chain, i.e.
 * you cannot override/re-implement decorated base methods.
 * Use an un-decorated method in case e.g. before/after should be overridable.
 * In addition, don't rely on a particular order for hooks of the same kind, especially
 * when mixed between super and sub classes.
 */
export const BeforeAll = testMethodDecoratorFor("before");

/**
 * A decorator for marking a method to be executed before each test case in a test suite.
 * This method will run before every individual test case.
 *
 * @attention Be aware that this decorator hooks into the initializer chain, i.e.
 * you cannot override/re-implement decorated base methods.
 * Use an un-decorated method in case e.g. before/after should be overridable.
 * In addition, don't rely on a particular order for hooks of the same kind, especially
 * when mixed between super and sub classes.
 */
export const BeforeEach = testMethodDecoratorFor("beforeEach");

/**
 * A decorator for marking a method to be executed after each test case in a test suite.
 * This method will run after every individual test case.
 *
 * @attention Be aware that this decorator hooks into the initializer chain, i.e.
 * you cannot override/re-implement decorated base methods.
 * Use an un-decorated method in case e.g. before/after should be overridable.
 * In addition, don't rely on a particular order for hooks of the same kind, especially
 * when mixed between super and sub classes.
 */
export const AfterEach = testMethodDecoratorFor("afterEach");

/**
 * A decorator for marking a method to be executed after all test cases in a test suite.
 * This method will run once after all test cases have been executed.
 *
 * @attention Be aware that this decorator hooks into the initializer chain, i.e.
 * you cannot override/re-implement decorated base methods.
 * Use an un-decorated method in case e.g. before/after should be overridable.
 * In addition, don't rely on a particular order for hooks of the same kind, especially
 * when mixed between super and sub classes.
 */
export const AfterAll = testMethodDecoratorFor("after");

/**
 * A decorator for marking a method as a test case in a test suite.
 * Methods marked with this decorator will be executed as individual test cases.
 * The test case gets the test context as argument.
 */
export const Test = testMethodDecoratorFor("test");

/**
 * A decorator for marking a method as a test case in a test suite with additional options.
 */
export function TestWithOptions(options: TestOptions) {
    return testMethodDecoratorFor("test", options);
}

/**
 * Shorthand decorator for marking a method as a test.skip case in a test suite.
 */
export const TestSkipped = testMethodDecoratorFor("test", { skip: true });
/**
 * Shorthand decorator for marking a method as a test.todo case in a test suite.
 */
export const TestTodo = testMethodDecoratorFor("test", { todo: true });
/**
 * Shorthand decorator for marking a method as test.only case in a test suite.
 */
export const TestOnly = testMethodDecoratorFor("test", { only: true });

/**
 * Timeout default per environment variable.
 */
const envTimeout = process.env.NODETEST_DECORATORS_TIMEOUT;
const defaultTimeout = envTimeout == null ? undefined : parseInt(envTimeout, 10);

function suiteOn<T extends {}, CtorT extends SuiteCtor<T>>(
    options: TestOptions = {},
    ctor: CtorT,
    name = ctor.name,
    runParams?: Record<keyof T, unknown>,
) {
    const suiteOptions = ctor.suiteOptions;
    const timeout = options?.timeout ?? suiteOptions?.timeout ?? defaultTimeout;
    options = {
        ...suiteOptions,
        ...options,
        timeout,
    };

    if (options?.diagnostic) {
        name += `: ${options.diagnostic}`;
    }

    suite(name, options, (context) =>
        // next to exec all static initializers:
        Promise.resolve().then(() => {
            // re-check that suiteOptions are not defined on the test class itself:
            if (ctor.suiteOptions && ctor.suiteOptions !== suiteOptions) {
                throw new TypeError(
                    `Defining static suiteOptions is not supported on test classes, but just base classes of such, because the decorator is executed as a static initializer, too. Use @SuiteWithOptions() or @ParameterizedSuite({ options: {...} }) to set options on test classes.`,
                );
            }

            const inst = new ctor(context);
            Object.assign(inst, runParams);

            const map = instanceRel.get(inst);
            if (map) {
                for (const [meth, exec] of map.entries()) {
                    const { name, options } = exec;

                    const fn = options?.diagnostic
                        ? async (context: TestContext | SuiteContext) => {
                              (context as TestContext).diagnostic?.(options.diagnostic!);
                              await meth.call(inst, context);
                          }
                        : meth.bind(inst);

                    switch (exec.type) {
                        case "after":
                            test.after(fn, options);
                            break;
                        case "afterEach":
                            test.afterEach(fn, options);
                            break;
                        case "before":
                            test.before(fn, options);
                            break;
                        case "beforeEach":
                            test.beforeEach(fn, options);
                            break;
                        case "test":
                            test(name, options, fn);
                            break;
                        default:
                            throw new TypeError(`unexpected type: ${exec.type}`);
                    }
                }
            }
        }),
    );
}

/**
 * Creates a decorator function to decorate a method for a particular test hook or test case.
 *
 * @attention Be aware that this decorator hooks into the initializer chain, i.e.
 * you cannot override/re-implement decorated base methods.
 * Use an un-decorated method in case e.g. before/after should be overridable.
 */
export function testMethodDecoratorFor<TOptions extends TestOptions | HookOptions>(
    type: TDecoratorType,
    options?: TOptions,
) {
    return (originalMethod: AnyFunction, context: ClassMethodDecoratorContext<{}>) => {
        if (context.static) {
            throw new TypeError(`@${type}: Can only be used on instance method.`);
        }
        const name = context.name as string;
        context.addInitializer(function () {
            let entries = instanceRel.get(this);
            if (!entries) {
                entries = new Map<AnyFunction, TDecoratorEntry>();
                instanceRel.set(this, entries);
            }
            entries.set(originalMethod, {
                type,
                name,
                options,
            });
        });
    };
}
