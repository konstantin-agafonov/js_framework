const api = {
    get(url) {
        switch(url) {
            case '/lots':
                return new Promise((resolve) => {
                    setTimeout(()=>{
                        resolve(
                            [
                                {
                                    id: 1,
                                    name: 'Apple',
                                    desc: 'Apple is round',
                                    price: 4.99
                                },
                                {
                                    id: 2,
                                    name: 'Orange',
                                    desc: 'Orange is like an apple but orange',
                                    price: 5.55
                                },
                            ]
                        )
                    },2000)
                })
            default:
                throw new Error('Unknown url')
        }
    }
}

const stream = {
    subscribe(channel, listener) {
        const match = /price-(\d+)/.exec(channel)
        if (!match) {
            return;
        }
        setInterval(()=>{
            listener({
                id: parseInt(match[1], 10),
                price: Math.round(Math.random() * 10 + 30)
            })
        },400)
    }
}

let state = {
    time: new Date(),
    lots: null,
}

function App({state}) {
    const app = document.createElement('div')
    app.className = 'app'
    app.append(Header())
    app.append(Clock({time: state.time}))
    app.append(Lots({lots: state.lots}))
    return app
}

function Header() {
    const header = document.createElement('header')
    header.className = 'header'
    header.append(Logo())
    return header
}

function Logo() {
    return new Element('img', {className: 'logo', src: 'https://placehold.it/100x100'})
}

function Clock({time}) {
    const clock = document.createElement('div')
    clock.className = 'clock'

    const value = document.createElement('span')
    value.className = 'value'
    value.innerText = time.toLocaleTimeString()
    clock.append(value)

    const icon = document.createElement('span')
    if (time.getHours() >= 7 && time.getHours() <=21 ) {
        icon.className = 'icon day'
    } else {
        icon.className = 'icon night'
    }
    clock.append(icon)

    return clock
}

function Loading() {
    const node = document.createElement('div')
    node.className = 'loading'
    node.innerText = 'Loading...'
    return node;
}

function Lots({lots}) {
    if (lots === null) {
        return Loading()
    }
    const list = document.createElement('div')
    list.className = 'lots'

    lots.forEach((lot) => {
        list.append(Lot({lot}))
    })

    return list
}

function Lot({lot}) {
    const node = document.createElement('article')
    node.className = 'lot'
    node.dataset.key = lot.id

    const name = document.createElement('h1')
    name.innerText = lot.name
    node.append(name)

    const desc = document.createElement('p')
    desc.innerText = lot.desc
    node.append(desc)

    const price = document.createElement('div')
    price.className = 'price'
    price.innerText = lot.price
    node.append(price)

    return node;
}

function renderApp(state) {
    render(
        App({state}),
        document.querySelector('#root')
    )
}

renderApp(state)

setInterval(() => {
    state = {
        ...state,
        time: new Date()
    }
    renderApp(state)
}, 1000)

api.get('/lots').then((lots) => {
    state = {
        ...state,
        lots
    }
    renderApp(state)

    const onPrice = (data)=>{
        state = {
            ...state,
            lots: state.lots.map((lot)=> {
                if (lot.id !== data.id) {
                    return lot
                }
                return {
                    ...lot,
                    price: data.price
                }
            })
        }
        renderApp(state)
    }

    lots.forEach((lot) => {
        stream.subscribe(`price-${lot.id}`, onPrice)
    })
})

function render(virtualDom, realDomRoot) {
    const virtualDomRoot = document.createElement(
        realDomRoot.tagName
    )
    virtualDomRoot.id = realDomRoot.id
    virtualDomRoot.append(virtualDom)

    sync(virtualDomRoot, realDomRoot)
}

function sync(virtualNode, realNode) {
    if (virtualNode.id !== realNode.id) {
        realNode.id = virtualNode.id
    }
    if (virtualNode.className !== realNode.className) {
        realNode.className = virtualNode.className
    }

    if (virtualNode.attributes) {
        Array.from(virtualNode.attributes).forEach((attr) => {
            if (realNode[attr.name] !== attr.value) {
                realNode[attr.name] = attr.value
            }
        })
    }

    if (virtualNode.nodeValue !== realNode.nodeValue) {
        realNode.nodeValue = virtualNode.nodeValue
    }

    const virtualChildren = virtualNode.childNodes;
    const realChildren = realNode.childNodes;

    for (let i = 0; i < Math.max(virtualChildren.length, realChildren.length); i++) {
        const virtual = virtualChildren[i]
        const real = realChildren[i]

        // remove
        if (virtual === undefined && real !== undefined ) {
            realNode.remove(real)
        }

        //update
        if (virtual !== undefined && real !== undefined && virtual.tagName === real.tagName ) {
            sync(virtual, real)
        }

        // replace
        if (virtual !== undefined && real !== undefined && virtual.tagName !== real.tagName ) {
            const newReal = createRealNodeByVirtual(virtual)
            sync(virtual, newReal)
            realNode.replaceChild(newReal, real)
        }

        // add
        if (virtual !== undefined && real === undefined ) {
            const newReal = createRealNodeByVirtual(virtual)
            sync(virtual, newReal)
            realNode.appendChild(newReal)
        }
    }

}

function createRealNodeByVirtual(virtual) {
    let newReal
    if (virtual.nodeType === Node.TEXT_NODE) {
        newReal = document.createTextNode('')
    } else {
        newReal = document.createElement(virtual.tagName)
    }
    return newReal
}