# typescript-nodetest-decorators

<a href="https://github.com/dbo/typescript-nodetest-decorators/actions">![CI](https://github.com/dbo/typescript-nodetest-decorators/actions/workflows/ci.yml/badge.svg)</a>
<a href="https://www.npmjs.com/package/typescript-nodetest-decorators">![NPM Version](https://img.shields.io/npm/v/typescript-nodetest-decorators)</a>


Typescript decorators for [node.js test runner](https://nodejs.org/api/test.html) based tests.

These decorators follow [JUnit5](https://junit.org/junit5/) naming, e.g. `@BeforeEach` will hook on `node:test`'s `test.beforeEach()`.

## Decorators
Each test class needs to be decorated with `@Suite`, e.g.

```typescript
@Suite
class MyTest {
    @Test
    my_test_case(context: TestContext) {
    }
    @BeforeEach
    beforeEach() {
    }
}
```

Additionally test classes can be parameterized to execute the same test class for multiple parameters, e.g.

```typescript
@ParameterizedSuite({
    properties: ["iter", "p1"],
    propertyValues: [
        [0, "pp0"],
        {
            options: {
                // custom labeling to "MyTest #1":
                diagnostic: "this second case with pp1",
                timeout: 500,
            },
            values: [1, "pp1"],
        },
        [2, "pp2"],
    ],
})
class MyTest {
    iter = 0; // 0, 1, 2
    p1 = ""; // pp0, pp1, pp2

    @Test
    my_test_case(context: TestContext) {
        // runs 3 times
    }
}
```

## Options
The test options are passed "as is" to `node:test`. There are two enhancements:
- You can define an additional `diagnostic` string per options that emits a diagnostic message.
- You can set a default timeout (in milliseconds) per environment variable `NODETEST_DECORATORS_TIMEOUT` (instead of sticking to the default Infinity).

### Common base classes
Sometimes it's useful to define a common base class for a set of test classes instead of going with a `@ParameterizedSuite` spreading varying properties.
These base classes could define test cases per `@Test` or hooks like  `@BeforeEach`.

You can also define options on a base class per `static suiteOptions`.
Defining `static suiteOptions` is not supported on test (sub) classes, but just their base class, because the decorator is executed as a static initializer. Use `@SuiteWithOptions()` or `@ParameterizedSuite({ options: {...} })` to set options on test classes.

## Installation

Use it alongside with `typescript` as a dev dependency, e.g.

```bash
$ npm install typescript-nodetest-decorators --save-dev
```
