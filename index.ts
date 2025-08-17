import { serve, $ } from 'bun'
import { workspaceCommand, windowsCommand, batteryCommand, getAllAppsCommand } from './commands.ts'

const server = serve({
	routes: {
		"/update-workspaces": () => {
			workspaces()
			return new Response("success")
		},
		"/command": (req, server) => {
			const command = (new URL(req.url)).searchParams.get("command")
			server.publish("state", JSON.stringify({ type: command }))
			return new Response("success")
		},
		"/update-battery": async (req, server) => {
			let data = await req.json()
			server.publish("state", JSON.stringify({ type: "UPDATE_BATTERY", data }))
			return new Response("success")
		},
		"/listen": (req, server) => {
			if (server.upgrade(req)) {
				return
			}

			return new Response("Upgrade failed", { status: 500 })
		}
	},
	websocket: {
		open(ws) {
			ws.subscribe("state")
			battery()
			workspaces()
			apps()
		},
		message(_, message) {
			console.log(`client sent message: ${message}`)
		}
	}
})

function ShellCommandPublisher(shellOutput: () => ReturnType<$>, payloadType: string): () => void {
	return () => {
		shellOutput().then(output => {
			let payload = JSON.stringify({ type: payloadType, data: output.json() })
			server.publish("state", payload)
		})
	}
}

const apps = ShellCommandPublisher(getAllAppsCommand, "UPDATE_APP_LIST")
const battery = ShellCommandPublisher(batteryCommand, "UPDATE_BATTERY")
const workspaces = ShellCommandPublisher(workspaceCommand, "UPDATE_WORKSPACES")
