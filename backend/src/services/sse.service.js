const connection = new Map()


const addConnection = (userId, res) => {
    if (!connection.has(userId)) {
        connection.set(userId, new Set())
    }
    connection.get(userId).add(res)
}

const removeConnection = (userId, res) => {
    const userConnections = connection.get(userId)

    if (!userConnections) return;

    userConnections.delete(res)

    if (userConnections.size === 0) {
        connection.delete(userId)
    }
}

const sendToUser = (userId, payload) => {
    const userConnections = connection.get(userId)

    if (!userConnections) return;

    const message = `data: ${JSON.stringify(payload)}\n\n`

    for (const res of userConnections) {
        res.write(message)
    }
}



module.exports = { addConnection, removeConnection, sendToUser }