import { createRuntime } from "./run.js";

let runtime = createRuntime();

console.log(
  runtime(
    process.cwd(),
    `
<!DOCTYPE html>
<html>

<head>
    <title></title>
</head>

<body bg="red">
    <p>
        {Date()}{\`\\\`\`}
    </p>
</body>

</html>
`,
  ).default(),
);
