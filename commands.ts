import { $ } from 'bun'

const AEROSPACE = "/opt/homebrew/bin/aerospace"
const BIN = "/Users/blu/bin"
const JQ = "/usr/bin/jq"

function workspaceCommand(): ReturnType<$> {
  return $`echo "$(${AEROSPACE} list-workspaces --all --json --format "%{workspace}%{workspace-is-focused}")$(echo $(${AEROSPACE} list-windows --focused --json --format "%{window-id}" || echo "[]")$(${AEROSPACE} list-windows --all --json --format "%{window-id}%{app-name}%{workspace}") | jq --slurp '(.[0] | map(.["window-id"])) as $focused_ids | .[1]| map(. + { focused: (.["window-id"] | IN($focused_ids[])) })')" | ${JQ} -s '.[0] as $workspaces | .[1] | map({ app: .["app-name"], id: .["window-id"], workspace: .["workspace"], foucesd: .["focused"]}) as $apps
    | $workspaces
    | map(. as $w | { workspace: $w.["workspace"], focused: $w.["workspace-is-focused"], windows: ($apps | map(select(.workspace == $w.workspace)))})'`
}


export { AEROSPACE, BIN, workspaceCommand } 
