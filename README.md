# typescript-nodetest-decorators
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
        [1, "pp1"],
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
- You can provide options to the suite per `static suiteOptions`. This is particularly helpful in case you sub class from a common base class (which may define suite test options).
- You can set a default timeout (in milliseconds) per environment variable `NODETEST_DECORATORS_TIMEOUT` (instead of sticking to the default Infinity).
