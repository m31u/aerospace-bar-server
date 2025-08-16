import { $ } from 'bun'

const AEROSPACE = "/opt/homebrew/bin/aerospace"
const BIN = "/Users/blu/bin"
const JQ = "/usr/bin/jq"

function workspaceCommand(): ReturnType<$> {
  return $`echo "$(${AEROSPACE} list-workspaces --monitor 1 --empty no --json)$(${AEROSPACE} list-workspaces --focused --json)$(${AEROSPACE} list-workspaces --all --json)" | ${JQ} -s '
  (.[0] | map(.workspace|tostring)) as $occupied
  | (.[1] | map(.workspace|tostring)) as $focused
  | .[2] | map(
      . + {
        empty:   ((.workspace|tostring) as $w | ($occupied | index($w) | not)),
        focused: ((.workspace|tostring) as $w | ($focused  | index($w) | not) | not)
      }
    )
'`
}

function windowsCommand(): ReturnType<$> {
  return $`echo $(${AEROSPACE} list-windows --focused --json || echo "[]")$(${AEROSPACE} list-windows --workspace $(${AEROSPACE} list-workspaces --focused) --json) | ${JQ} -s '
  (.[0] | map(.["window-id"])) as $focused_ids
  | .[1] | map({
      app: .["app-name"],
      id: .["window-id"],
      title: .["window-title"],
      focused: (.["window-id"] as $id | ($focused_ids | index($id) | not) | not)
    })
'`
}

function batteryCommand(): ReturnType<$> {
  return $`${BIN}/batterymonitord --get`
}

export { AEROSPACE, BIN, workspaceCommand, windowsCommand, batteryCommand } 
