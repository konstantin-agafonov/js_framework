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
    return React.createElement('div', { className: 'app' },
        React.createElement(Header),
        React.createElement(Clock, { time: state.time }),
        React.createElement(Lots, { lots: state.lots }),
    );
}

function Block(props) {
    return React.createElement('div', { className: 'block' }, props.children);
}

function Header() {
    return React.createElement(
        'header',
        {className: 'header'},
        React.createElement(Block, {},React.createElement(Logo))
    );
}

function Logo() {
    return React.createElement('img', {
        className: 'logo',
        src: 'http://via.placeholder.com/100x100',
    });
}

function Clock({time}) {
    const isDay = time.getHours() >= 7 && time.getHours() <= 21;
    return React.createElement('div', { className: 'clock' },
        React.createElement('span', { className: 'value' }, time.toLocaleTimeString()),
        React.createElement('span', { className: `icon ${isDay ? 'day' : 'night'}` })
    );
}

function Loading() {
    return React.createElement('div', { className: 'loading' }, 'Loading...')
}

function Lots({lots}) {
    if (lots === null) {
        return React.createElement(Loading)
    }

    return React.createElement('div', { className: 'lots' }, lots.map((lot) =>
        React.createElement(Lot, {lot, key: lot.id})
    ))
}

function Lot({ lot, key }) {
    return React.createElement('article', {
            className: 'lot',
            key,
        },
        React.createElement('h1', {}, lot.name),
        React.createElement('p', {}, lot.desc),
        React.createElement('div', { className: 'price' }, lot.price)
    )
}

let root = ReactDOM.createRoot(document.querySelector('#root'))

function renderApp(state) {
    root.render(React.createElement(App, { state }))
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
