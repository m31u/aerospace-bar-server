import { $ } from 'bun'

const AEROSPACE = "/opt/homebrew/bin/aerospace"
const BIN = "/Users/blu/bin"
const JQ = "/usr/bin/jq"

function workspaceCommand(): ReturnType<$> {
  return $`echo "$(${AEROSPACE} list-workspaces --all --json --format "%{workspace}%{workspace-is-focused}")$(${AEROSPACE} list-windows --all --json --format "%{window-id}%{app-name}%{workspace}" )" | ${JQ} -s '.[0] as $workspaces | .[1] | map({ app: .["app-name"], id: .["window-id"], workspace: .["workspace"]}) as $apps
    | $workspaces
    | map(. as $w | { workspace: $w.["workspace"], focused: $w.["workspace-is-focused"], windows: ($apps | map(select(.workspace == $w.workspace)))})'`
}

function batteryCommand(): ReturnType<$> {
  return $`${BIN}/batterymonitord --get`
}

export { AEROSPACE, BIN, workspaceCommand, batteryCommand } 
