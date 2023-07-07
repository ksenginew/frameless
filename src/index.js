function parse(input){
    let index = 0

    function match(re){
        let m = input.match(re)
        if(m){
         input = input.slice(m[0].length)
            return m
        }
    }
    function text() {
        
    }
    function fragment(){
        return text()
    }

    return fragment()
}