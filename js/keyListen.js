//键盘监听
function key() {
    this.left = false;
    this.right = false;
    this.space = false;
    this.spaceHold = false;
    document.onkeydown = this.keydown.bind(this);
    document.onkeyup = this.keyup.bind(this);
}

key.prototype = {
    keydown: function (key) {
        var keycode = key.keyCode;
        if (keycode === 32) {
            this.space = true;
        } else if (keycode === 37) {
            this.left = true;
            this.right = false;
        } else if (keycode === 39) {
            this.right = true;
            this.left = false;
        }
    },
    keyup: function (key) {
        var keycode = key.keyCode;
        if (keycode === 32) {
            this.space = false;
        } else if (keycode === 37) {
            this.left = false;
        } else if (keycode === 39) {
            this.right = false;
        }
    }
}

