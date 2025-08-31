import { serve, $, type ServerWebSocket } from 'bun'
import { workspaceCommand } from './commands.ts'

function upgrade(req: Request, server: ReturnType<typeof serve>) {
	if (server.upgrade(req, { data: { url: req.url } })) {
		return
	}


	return new Response("Upgrade failer", { status: 500 })
}

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
		"/client": upgrade,
		"/daemon": upgrade
	},
	websocket: {
		open(ws: ServerWebSocket<{ url: string }>) {
			const url = new URL(ws.data.url)
			const name = url.searchParams.get("name")

			if (url.pathname == "/client" && name) {
				ws.subscribe("state")
				workspaces()
				server.publish("client_connection", JSON.stringify({ type: "REGISTER_CLIENT", name }))
			}

			if (url.pathname == "/daemon" && name) {
				ws.subscribe("client_connection")
				server.publish("state", JSON.stringify({ type: "REGISTER_DAEMON", data: name }))
			}

			return
		},
		message(ws: ServerWebSocket<{ url: string }>, message) {
			const url = new URL(ws.data.url)

			if (url.pathname == "/daemon") {
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
