const {screen} = require('electron');
const useWindowSize = () =>{
    const  { width, height } = screen.getPrimaryDisplay().workAreaSize
    return { width, height };
}

module.exports = useWindowSize;