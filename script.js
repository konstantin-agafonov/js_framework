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
    return VDom.createElement('div', { className: 'app' },
        VDom.createElement(Header),
        VDom.createElement(Clock, { time: state.time }),
        VDom.createElement(Lots, { lots: state.lots }),
    );
}

function Block(props) {
    return VDom.createElement('div', { className: 'block' }, props.children);
}

function Header() {
    return VDom.createElement(
        'header',
        {className: 'header'},
        VDom.createElement(Block, {},VDom.createElement(Logo))
    );
}

function Logo() {
    return VDom.createElement('img', {
        className: 'logo',
        src: 'http://via.placeholder.com/100x100',
    });
}

function Clock({time}) {
    const isDay = time.getHours() >= 7 && time.getHours() <= 21;
    return VDom.createElement('div', { className: 'clock' },
        VDom.createElement('span', { className: 'value' }, time.toLocaleTimeString()),
        VDom.createElement('span', { className: `icon ${isDay ? 'day' : 'night'}` })
    );
}

function Loading() {
    return VDom.createElement('div', { className: 'loading' }, 'Loading...')
}

function Lots({lots}) {
    if (lots === null) {
        return VDom.createElement(Loading)
    }

    return VDom.createElement('div', { className: 'lots' }, lots.map((lot) =>
        VDom.createElement(Lot, {lot, key: lot.id})
    ))
}

function Lot({ lot, key }) {
    return VDom.createElement('article', {
            className: 'lot',
            key,
        },
        VDom.createElement('h1', {}, lot.name),
        VDom.createElement('p', {}, lot.desc),
        VDom.createElement('div', { className: 'price' }, lot.price)
    )
}

const VDom = {
    createElement: (type, config, ...children) => {
        const key = config ? (config.key || null) : null
        const props = config || {}

        if (children.length === 1) {
            props.children = children[0]
        } else {
            props.children = children
        }

        return {
            type,
            key,
            props,
        }
    }
}

function renderApp(state) {
    render(
        VDom.createElement(App, { state }),
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

function evaluate(virtualNode) {
    if (typeof virtualNode !== 'object') {
        return virtualNode
    }

    if (typeof virtualNode.type === 'function') {
        return evaluate((virtualNode.type)(virtualNode.props))
    }

    const props = virtualNode.props || {}

    return {
        ...virtualNode,
        props: {
            ...virtualNode.props,
            children: Array.isArray(props.children)
                ? props.children.map(evaluate)
                : [evaluate(props.children)]
        }
    }
}

function render(virtualDom, realDomRoot) {
    const evaluatedVirtualDom = evaluate(virtualDom)
    
    const virtualDomRoot = {
        type: realDomRoot.tagName.toLowerCase(),
        props: {
            id: realDomRoot.id,
            ...realDomRoot.attributes,
            children: [
                evaluatedVirtualDom,
            ],
        }
    };

    sync(virtualDomRoot, realDomRoot)
}



function sync(virtualNode, realNode) {
    if (virtualNode.props) {
        Object.entries(virtualNode.props).forEach(([name, value]) => {
            if (name === 'children' || name === 'key') {
                return
            }

            if (realNode[name] !== value) {
                realNode[name] = value
            }
        })
    }

    if (virtualNode.key) {
        realNode.dataset.key = virtualNode.key;
    }
    if (typeof virtualNode !== 'object' && virtualNode !== realNode.nodeValue) {
        realNode.nodeValue = virtualNode
    }

    const virtualChildren = virtualNode.props ? virtualNode.props.children || [] : []
    const realChildren = realNode.childNodes;

    for (let i = 0; i < Math.max(virtualChildren.length, realChildren.length); i++) {
        const virtual = virtualChildren[i]
        const real = realChildren[i]

        // remove
        if (virtual === undefined && real !== undefined) {
            realNode.remove(real)
        }

        //update
        if (virtual !== undefined
            && real !== undefined
            && (virtual.type || '') === (real.tagName || '').toLowerCase()) {
            sync(virtual, real)
        }

        // replace
        if (virtual !== undefined
            && real !== undefined
            && (virtual.type || '') !== (real.tagName || '').toLowerCase()) {
            const newReal = createRealNodeByVirtual(virtual)
            sync(virtual, newReal)
            realNode.replaceChild(newReal, real)
        }

        // add
        if (virtual !== undefined && real === undefined) {
            const newReal = createRealNodeByVirtual(virtual)
            sync(virtual, newReal)
            realNode.appendChild(newReal)
        }
    }
}

function createRealNodeByVirtual(virtual) {
    if (typeof virtual !== 'object') {
        return document.createTextNode('')
    }
    return document.createElement(virtual.type)
}
