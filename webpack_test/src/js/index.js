/**
 * Created by ziyu on 2017/7/5.
 */

console.log(121);

require('./../css/index.css');
require('./../css/nav.css');
require('./../css/banner.css');

require('jquery');

let test= function(num){return num*2} ;
let a = test(3);
console.log(a);
console.log(2223);

(($)=>{
    $(()=>{
        setTimeout(()=>{
            // $('body').css('background','green');
        },3000)
    });


})(jQuery);


