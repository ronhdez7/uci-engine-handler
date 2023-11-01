// prettier-ignore
export type StandardUCICommands = "quit" | "uci" | "setoption" | "position" | "ucinewgame" | "isready" | "go" | "stop" | "ponderhit";
// prettier-ignore
export type NonStandardUCICommands = "bench" | "d" | "eval" | "compiler" | "export_net" | "flip"
export type UCICommand = StandardUCICommands | NonStandardUCICommands | "load";

export type MessageReceiver = (
  command: Command | undefined,
  event: MessageEvent<any>
) => void;
export type ErrorReceiver = (
  command: Command | undefined,
  event: ErrorEvent
) => void;

export type Command = {
  id: number;
  data?: any;
  cmd: string;
  status: "done" | "sent" | "waiting" | "failed";
};
