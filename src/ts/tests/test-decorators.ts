import assert from "node:assert";
import { type SuiteContext, type TestContext } from "node:test";
import {
    AfterAll,
    AfterEach,
    BeforeAll,
    BeforeEach,
    ParameterizedSuite,
    Suite,
    Test,
    TestWithOptions,
    type TestOptions,
} from "../nodetest/decorators.js";

abstract class SuperClass {
    static suiteOptions: TestOptions = {
        diagnostic: "SuperClass suiteOptions mark as TODO",
        todo: true,
    };

    seq: string[] = [];

    constructor(context: SuiteContext) {
        this.seq.push(context.name);
    }

    @Test
    async superTest(context: TestContext) {
        this.seq.push(`SuperClass.superTest - ${context.name}`);
    }
    @BeforeEach
    async superBeforeEach(context: TestContext) {
        this.seq.push(`SuperClass.superBeforeEach - ${context.name}`);
    }
    @AfterEach
    async superAfterEach(context: TestContext) {
        this.seq.push(`SuperClass.superAfterEach - ${context.name}`);
    }
    @BeforeAll
    async superBeforeAll(context: TestContext) {
        this.seq.push(`SuperClass.superBeforeAll - ${context.name}`);
    }
    @AfterAll
    superAfterAll(context: TestContext) {
        this.seq.push(`SuperClass.superAfterAll - ${context.name}`);
    }
}

@ParameterizedSuite({
    properties: ["iter", "p1"],
    propertyValues: [
        [0, "pp0"],
        {
            options: {
                diagnostic: "second set of params with more options",
            },
            values: [1, "pp1"],
        },
        [2, "pp2"],
    ],
})
export class SubClass extends SuperClass {
    iter = 0;
    p1 = "";

    @Test
    test(context: TestContext) {
        this.seq.push(`SubClass.test - ${context.name} ${this.iter}:${this.p1}`);
    }
    @BeforeEach
    beforeEach(context: TestContext) {
        this.seq.push(`SubClass.beforeEach - ${context.name} ${this.iter}:${this.p1}`);
    }
    @AfterEach
    afterEach(context: TestContext) {
        this.seq.push(`SubClass.afterEach - ${context.name} ${this.iter}:${this.p1}`);
    }
    @BeforeAll
    beforeAll(context: TestContext) {
        this.seq.push(`SubClass.beforeAll - ${context.name} ${this.iter}:${this.p1}`);
    }
    @AfterAll
    afterAll(context: TestContext) {
        this.seq.push(`SubClass.afterAll - ${context.name} ${this.iter}:${this.p1}`);
        const act = this.seq;
        const diag =
            this.iter === 1
                ? "second set of params with more options"
                : "SuperClass suiteOptions mark as TODO";

        const exp = [
            `SubClass #${this.iter}: ${diag}`,
            `SuperClass.superBeforeAll - SubClass #${this.iter}: ${diag}`,
            `SubClass.beforeAll - SubClass #${this.iter}: ${diag} ${this.iter}:pp${this.iter}`,
            `SuperClass.superBeforeEach - superTest`,
            `SubClass.beforeEach - superTest ${this.iter}:pp${this.iter}`,
            `SuperClass.superTest - superTest`,
            `SuperClass.superAfterEach - superTest`,
            `SubClass.afterEach - superTest ${this.iter}:pp${this.iter}`,
            `SuperClass.superBeforeEach - test`,
            `SubClass.beforeEach - test ${this.iter}:pp${this.iter}`,
            `SubClass.test - test ${this.iter}:pp${this.iter}`,
            `SuperClass.superAfterEach - test`,
            `SubClass.afterEach - test ${this.iter}:pp${this.iter}`,
            `SuperClass.superBeforeEach - asyncTest`,
            `SubClass.beforeEach - asyncTest ${this.iter}:pp${this.iter}`,
            `SubClass.asyncTest - asyncTest ${this.iter}:pp${this.iter}`,
            `SuperClass.superAfterEach - asyncTest`,
            `SubClass.afterEach - asyncTest ${this.iter}:pp${this.iter}`,
            `SuperClass.superAfterAll - SubClass #${this.iter}: ${diag}`,
            `SubClass.afterAll - SubClass #${this.iter}: ${diag} ${this.iter}:pp${this.iter}`,
        ];
        assert.equal(act.length, exp.length, "same number of entries");
        act.forEach((v, i) => {
            assert.equal(v, exp[i], `same entry at index ${i}`);
        });
        // assert.deepEqual(
        //     this.seq,
        //     "should follow the correct order",
        // );
    }

    @TestWithOptions({
        todo: true,
        timeout: 200,
        diagnostic: "times out intentionally",
    })
    async asyncTest(context: TestContext) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.seq.push(`SubClass.asyncTest - ${context.name} ${this.iter}:${this.p1}`);
    }
}

@Suite
export class StaticInitTest {
    static foo = "bar";

    constructor() {
        assert.equal(StaticInitTest.foo, "bar", "static initialization");
    }
}
