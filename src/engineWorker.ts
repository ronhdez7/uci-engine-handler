import {
  Command,
  ErrorReceiver,
  MessageReceiver,
  UCICommand,
} from "./types/index";

class UCIEngineWorker {
  public readonly worker: Worker;
  private readonly commands: Command[] = [];
  private readonly commandQuery: Command[] = [];
  private messageReceiver: MessageReceiver | null = null;
  private errorReceiver: ErrorReceiver | null = null;
  private isCommandDone = true;
  private awaitMessages = true;
  private currCommandIdx = -1;
  private isReady = false;

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = (event) => {
      const currCommand = this.commands[this.currCommandIdx];
      this.messageReceiver?.(currCommand, event);

      if (this.isReady && event.data === "readyok") {
        this.commands.forEach((cmd) => {
          if (cmd.cmd === "isready" && cmd.status === "sent") {
            cmd.status = "done";
          }
        });
        return (this.isReady = false);
      }
      if (currCommand && this.isCommandFinished(currCommand.cmd, event.data)) {
        this.isCommandDone = true;
        this.currCommandIdx = -1;
        currCommand.status = "done";
        console.log(currCommand, "ended");
        const command = this.commandQuery.shift();
        if (command) this.send(command.cmd);
      }
    };
    this.worker.onerror = (error) => {
      if (!this.errorReceiver) return;
      const currCommand = this.commands[this.currCommandIdx];
      if (currCommand) currCommand.status = "failed";
      this.errorReceiver(currCommand, error);
    };
  }

  private isCommandFinished(commandString: string, data?: any) {
    const command = commandString.split(" ")[0] as UCICommand | undefined;
    if (!command) return true;
    // Should never happen; immediately finishes command
    if (command === "quit" || command === "stop") {
      return true;
    }
    if (typeof data !== "string") {
      if (command === "position") return true;
      if (command === "ucinewgame") return true;
      if (command === "setoption") return true;
      if (command === "flip") return true;
      return false;
    }
    if ((command === "uci" || command === "load") && data.startsWith("uciok")) {
      return true;
    } else if (
      command === "position" ||
      command === "ucinewgame" ||
      command === "setoption" ||
      command === "flip"
    ) {
      return true;
    } else if (
      (command === "go" || command === "ponderhit") &&
      data.startsWith("bestmove")
    ) {
      return true;
    } else if (command === "isready" && data.startsWith("readyok")) {
      // Should never happen either
      return true;
    } else if (command === "bench" && data.startsWith("Nodes/second")) {
      return true;
    } else if (command === "d" && data.startsWith("Checkers:")) {
      return true;
    } else if (command === "eval" && data.startsWith("Final evaluation")) {
      return true;
    }
    return false;
  }

  // full command string
  send(cmd: string): number {
    const command: Command = {
      id: this.commands.length,
      cmd,
      status: "sent",
    };
    if (!this.awaitMessages) {
      this.worker.postMessage(command.cmd);
      return command.id;
    }
    // Priority Commands
    if (command.cmd.startsWith("quit")) {
      this.worker.postMessage(command.cmd);
      this.commands.push(command);
      this.destroy();
    } else if (command.cmd.startsWith("stop")) {
      this.commands.push(command);
      this.worker.postMessage(command.cmd);
    } else if (command.cmd.startsWith("isready")) {
      this.isReady = true;
      this.commands.push(command);
      this.worker.postMessage(command.cmd);
    } else if (this.isCommandDone) {
      const isDone = this.isCommandFinished(command.cmd);
      if (isDone) command.status = "done";
      // if no other commands are running
      this.commands.push(command);
      this.worker.postMessage(command.cmd);
      // check if command sends a message
      if (!isDone) {
        this.currCommandIdx = this.commands.length - 1;
        this.isCommandDone = false;
      } else {
        const nextCommand = this.commandQuery.shift();
        if (nextCommand) this.send(nextCommand.cmd);
      }
    } else {
      // add command to execute later
      command.status = "waiting";
      this.commandQuery.push(command);
    }
    return command.id;
  }

  onMessage(messageReceiver: MessageReceiver) {
    this.messageReceiver = messageReceiver;
  }

  onError(errorReceiver: ErrorReceiver) {
    this.errorReceiver = errorReceiver;
  }

  destroy() {
    this.worker.terminate();
  }

  get history(): Readonly<Command>[] {
    return this.commands;
  }
}

export default UCIEngineWorker;
