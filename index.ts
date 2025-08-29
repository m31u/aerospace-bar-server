import { serve, $, type ServerWebSocket } from 'bun'
import { workspaceCommand, batteryCommand } from './commands.ts'

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
		"/heartbeat": () => {
			const res = new Response("alive")

			res.headers.set('Access-Control-Allow-Origin', '*')

			return res
		},
		"/listen": (req, server) => {
			if (server.upgrade(req)) {
				return
			}

			return new Response("Upgrade failed", { status: 500 })
		}
	},
	websocket: {
		open(_) {
			return
		},
		message(ws, message) {
			const data = JSON.parse(message.toString())

			if (isRegisterMessage(data)) {
				handleRegisterNewConnection(ws, data)
			}

			if (isDaemonPayload(data)) {
				server.publish("state", JSON.stringify(data))
			}

		}
	}
})

function handleRegisterNewConnection(ws: ServerWebSocket<unknown>, data: RegisterMessage) {
	if (data.type === "daemon") {
		ws.subscribe("client_connection")
		server.publish("state", JSON.stringify({ type: "REGISTER_DAEMON", data: data.name }))
	}

	if (data.type === "client") {
		ws.subscribe("state")
		workspaces()
		server.publish("client_connection", JSON.stringify({ type: "REGISTER_CLIENT", name: data.name }))
	}
}

type RegisterMessage = {
	type: "daemon" | "client",
	name: String
}

function isRegisterMessage(data: any): data is RegisterMessage {
	return data.hasOwnProperty("type") &&
		(data.type == "daemon" || data.type == "client") &&
		data.hasOwnProperty("name")
}

type DaemonPayload = {
	type: String,
	data: any
}

function isDaemonPayload(data: any): data is DaemonPayload {
	return data.hasOwnProperty("type") && data.hasOwnProperty("data")
}

function ShellCommandPublisher(shellOutput: () => ReturnType<$>, payloadType: string): () => void {
	return () => {
		shellOutput().then(output => {
			let payload = JSON.stringify({ type: payloadType, data: output.json() })
			server.publish("state", payload)
		})
	}
}

const workspaces = ShellCommandPublisher(workspaceCommand, "UPDATE_WORKSPACES")
