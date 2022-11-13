import type { z } from "zod";

// goodies
// - zod is only type dependencies

// silly limitations
// - no positional arguments
// - each flag must start with "--"
// - no multiple arguments for single flag

// todo
// - unused arguments is simply ignored
// - prettier error message

//
// api
//

type Command = (args: string[]) => unknown;

export function tinycli<T extends z.AnyZodObject>(
  schema: T,
  action: (args: z.infer<T>) => unknown
): Command {
  return (args: string[]) => {
    return action(schema.parse(parseRawArgs(args)));
  };
}

export function tinycliMulti(
  commands: Record<string, Command>,
  defaultCommand?: Command
): Command {
  return (args: string[]) => {
    const [name, ...restArgs] = args;
    if (name && name in commands) {
      return commands[name](restArgs);
    }
    if (defaultCommand) {
      return defaultCommand(args);
    }
    const actual = Object.keys(commands).join(", ");
    throw new Error(
      `invalid command '${name}' (available commands: ${actual})`
    );
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
