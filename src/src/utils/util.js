import enquireJs from "enquire.js";

export function isDef(v) {
  return v !== undefined && v !== null;
}

/**
 * Remove an item from an array.
 */
export function remove(arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}

export function isRegExp(v) {
  return _toString.call(v) === "[object RegExp]";
}

export function enquireScreen(call) {
  const handler = {
    match: function() {
      call && call(true);
    },
    unmatch: function() {
      call && call(false);
    },
  };
  enquireJs.register("only screen and (max-width: 767.99px)", handler);
}

export function getQueryString(name, url) {
  let result = new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(url);
  if (!result) {
    return null;
  }
  let val = result[1].replace(/\+/g, "%20");
  if (!val) {
    return null;
  }
  return decodeURIComponent(val);
}

const _toString = Object.prototype.toString;
