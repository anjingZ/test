// Created by zr8732@126.com  on 2014/10/7.

(function(win){
    var moduleA = {
        add:function(a,b){
            console.log(a + b);
        }
    };
    return win.moduleA = moduleA;

})(window);