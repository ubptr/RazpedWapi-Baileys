const socket = io()

socket.on('qr', (qr) => {
    document.getElementById('qr').src =
        'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + qr
})

socket.on('status', (status) => {
    console.log('WA Status:', status)
})

function startWA() {
    socket.emit('start-wa', { phone: '628xxxx' })
}

function stopWA() {
    socket.emit('stop-wa')
}
