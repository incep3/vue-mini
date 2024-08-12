## Vue.js 模版编译器的工作流程

模版-> 词法分析 -> 语法分析 -> 模版 AST -> Transformer -> JavaScript AST -> 代码生成 -> 渲染函数

```js
const templateAST = parse(template)
const jsAST = transformer(templateAST)
const code = generate(jsAST)
```

- 用来将模版字符串解析为模版 AST 的解析器（parser）；
- 用来将模版 AST 转换为 JavaScript AST 的转换器（transformer）；
- 用来根据 JavaScript AST 生成渲染函数代码的生成器（generator）。

## test
```
//# compile
cd tests
node compile.test.js

// 递归下降算法
// # parser2
node parser2.test.js
```