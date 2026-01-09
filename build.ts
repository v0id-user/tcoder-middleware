// Ensure dist directory exists
try {
  await Deno.mkdir("./dist", { recursive: true });
} catch {
  // Directory already exists
}

// Use Deno's module graph to resolve and bundle
const command = new Deno.Command(Deno.execPath(), {
  args: [
    "bundle",
    "--import-map=./import_map.json",
    "./main.ts",
  ],
  stdout: "piped",
  stderr: "piped",
});

const { code, stdout, stderr } = await command.output();

if (code !== 0) {
  const errorText = new TextDecoder().decode(stderr);
  console.error(errorText);
  Deno.exit(1);
}

const bundleCode = new TextDecoder().decode(stdout);
await Deno.writeTextFile("./dist/main.js", bundleCode);
console.log("✓ Built dist/main.js");
