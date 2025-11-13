import { serve, $, type ServerWebSocket } from 'bun'
import { workspaceCommand } from './commands.ts'

function upgrade(req: Request, server: ReturnType<typeof serve>) {
	const url = new URL(req.url)
	const name = url.searchParams.get("name")
	const path = url.pathname

	if (server.upgrade(req, { data: { name, path } })) {
		return
	}


	return new Response("Upgrade failer", { status: 500 })
}

function parseParmater(input: string): any {
	try {
		return JSON.parse(input)
	}
	catch {
		return input
	}
}

const server = serve({
	routes: {
		"/update-workspaces": () => {
			workspaces()
			return new Response("success")
		},
		"/command": (req, server) => {
			const params = (new URL(req.url)).searchParams
			const payload: { type?: string, data?: { [key: string]: any } } = {}

			params.forEach((value, key) => {
				if (key === "command") {
					payload.type = value
					return
				}
				if (payload.data === undefined) {
					payload.data = {}
				}
				payload.data[key] = parseParmater(value)
			})

			server.publish("state", JSON.stringify(payload))
			return new Response("success")
		},
		"/heartbeat": () => {
			const res = new Response("alive")
			res.headers.set('Access-Control-Allow-Origin', '*')
			return res
		},
		"/client": upgrade,
		"/daemon": upgrade
	},
	websocket: {
		open(ws: ServerWebSocket<{ name: string, path: string }>) {
			if (ws.data.path == "/client" && ws.data.name) {
				ws.subscribe("state")
				workspaces()
				server.publish("client_connection", JSON.stringify({ type: "REGISTER_CLIENT", data: ws.data.name }))
			}

			if (ws.data.path == "/daemon" && ws.data.name) {
				ws.subscribe("client_connection")
				server.publish("state", JSON.stringify({ type: "REGISTER_DAEMON", data: ws.data.name }))
			}

			return
		},
		message(ws: ServerWebSocket<{ name: string, path: string }>, message) {
			if (ws.data.path === "/daemon") {
				server.publish("state", message)
			}
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

const workspaces = ShellCommandPublisher(workspaceCommand, "UPDATE_WORKSPACES")
