import type { z } from "zod";

// goodies
// - zod is only type dependencies

// silly limitations
// - no positional arguments
// - each flag must start with "--"
// - no multiple arguments for single flag

// todo
// - unused arguments is simply ignored

//
// api
//

type Command = (args: string[]) => unknown;

export function tinycli<T extends z.AnyZodObject>(
  schema: T,
  action: (args: z.infer<T>) => unknown
): Command {
  return (args: string[]) => {
    const help = tinycliHelp(schema);
    if (args.length === 1 && args[0] === "--help") {
      console.error(help.trim());
      return;
    }
    const record = parseRawArgs(args);
    const parsed = schema.safeParse(record);
    if (parsed.success) {
      return action(parsed.data);
    }
    throw new Error("\n" + formatError(parsed.error) + "\n" + help);
  };
}

export function tinycliMulti(
  commands: Record<string, Command>,
  defaultCommand?: Command
): Command {
  return (args: string[]) => {
    const help = tinycliMultiHelp(commands);
    if (args.length === 1 && args[0] === "--help") {
      console.error(help.trim());
      return;
    }
    const [name, ...restArgs] = args;
    if (name && name in commands) {
      return commands[name](restArgs);
    }
    if (defaultCommand) {
      return defaultCommand(args);
    }
    throw new Error(help);
  };
}

//
// internal
//

function parseRawArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length - 1; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const flag = arg.slice(2);
      if (flag in result) {
        throw new Error("duplicate flag: " + flag);
      }
      result[flag] = args[i + 1];
    }
  }
  return result;
}

function formatError(error: z.ZodError) {
  let message = "";
  for (const [flag, errors] of Object.entries(error.flatten().fieldErrors)) {
    if (errors) {
      message += `  --${flag}: ${errors?.join(", ")}\n`;
    }
  }
  return message;
}

function tinycliHelp<T extends z.ZodObject<z.ZodRawShape>>(schema: T): string {
  let message = "available options:\n";
  for (const key in schema.shape) {
    const option = schema.shape[key];
    let line = [
      `--${key}`,
      // TODO: extra message?
      // option.description ?? option._def.typeName,
      !option.isOptional() && "(required)",
    ]
      .filter(Boolean)
      .join(" ");
    message += `  ${line}\n`;
  }
  return message;
}

function tinycliMultiHelp(commands: Record<string, Command>): string {
  let message = "available commands:\n";
  for (const name in commands) {
    message += `  - ${name}\n`;
  }
  return message;
}
