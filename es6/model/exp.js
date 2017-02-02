/**
 * Created by anry on 2017/2/2.
 */

let exp = {
    version: 1,
    name: 'exp name',
    getName: function () {
        console.log(this.name)
    }
}

// var dd = {
//     name: 'test dd',
//     setName:function (str) {
//         this.name = str
//     }
// }
//
// module.exports = {
//     exp: exp,
//     dd: dd
// };

module.exports = exp;