/**
 * Code is copied from https://github.com/bjornstar/blob-polyfill
 * Minor changes where done, because we don't need the whole polyfill, and because we want to force the FakeBlobBuilder
 */

function stringEncode(string) {
  var pos = 0;
  var len = string.length;
  var Arr = global.Uint8Array || Array; // Use byte array when possible

  var at = 0; // output position
  var tlen = Math.max(32, len + (len >> 1) + 7); // 1.5x size
  var target = new Arr((tlen >> 3) << 3); // ... but at 8 byte offset

  while (pos < len) {
    var value = string.charCodeAt(pos++);
    if (value >= 0xd800 && value <= 0xdbff) {
      // high surrogate
      if (pos < len) {
        var extra = string.charCodeAt(pos);
        if ((extra & 0xfc00) === 0xdc00) {
          ++pos;
          value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
        }
      }
      if (value >= 0xd800 && value <= 0xdbff) {
        continue; // drop lone surrogate
      }
    }

    // expand the buffer if we couldn't write 4 bytes
    if (at + 4 > target.length) {
      tlen += 8; // minimum extra
      tlen *= 1.0 + (pos / string.length) * 2; // take 2x the remaining
      tlen = (tlen >> 3) << 3; // 8 byte offset

      var update = new Uint8Array(tlen);
      update.set(target);
      target = update;
    }

    if ((value & 0xffffff80) === 0) {
      // 1-byte
      target[at++] = value; // ASCII
      continue;
    } else if ((value & 0xfffff800) === 0) {
      // 2-byte
      target[at++] = ((value >> 6) & 0x1f) | 0xc0;
    } else if ((value & 0xffff0000) === 0) {
      // 3-byte
      target[at++] = ((value >> 12) & 0x0f) | 0xe0;
      target[at++] = ((value >> 6) & 0x3f) | 0x80;
    } else if ((value & 0xffe00000) === 0) {
      // 4-byte
      target[at++] = ((value >> 18) & 0x07) | 0xf0;
      target[at++] = ((value >> 12) & 0x3f) | 0x80;
      target[at++] = ((value >> 6) & 0x3f) | 0x80;
    } else {
      // FIXME: do we care
      continue;
    }

    target[at++] = (value & 0x3f) | 0x80;
  }

  return target.slice(0, at);
}

/********************************************************/
/*               String Decoder fallback                */
/********************************************************/
function stringDecode(buf) {
  var end = buf.length;
  var res = [];

  var i = 0;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence =
      firstByte > 0xef ? 4 : firstByte > 0xdf ? 3 : firstByte > 0xbf ? 2 : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xc0) === 0x80) {
            tempCodePoint = ((firstByte & 0x1f) << 0x6) | (secondByte & 0x3f);
            if (tempCodePoint > 0x7f) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80) {
            tempCodePoint =
              ((firstByte & 0xf) << 0xc) |
              ((secondByte & 0x3f) << 0x6) |
              (thirdByte & 0x3f);
            if (
              tempCodePoint > 0x7ff &&
              (tempCodePoint < 0xd800 || tempCodePoint > 0xdfff)
            ) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if (
            (secondByte & 0xc0) === 0x80 &&
            (thirdByte & 0xc0) === 0x80 &&
            (fourthByte & 0xc0) === 0x80
          ) {
            tempCodePoint =
              ((firstByte & 0xf) << 0x12) |
              ((secondByte & 0x3f) << 0xc) |
              ((thirdByte & 0x3f) << 0x6) |
              (fourthByte & 0x3f);
            if (tempCodePoint > 0xffff && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xfffd;
      bytesPerSequence = 1;
    } else if (codePoint > 0xffff) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(((codePoint >>> 10) & 0x3ff) | 0xd800);
      codePoint = 0xdc00 | (codePoint & 0x3ff);
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  var len = res.length;
  var str = "";
  var j = 0;

  while (j < len) {
    str += String.fromCharCode.apply(String, res.slice(j, (j += 0x1000)));
  }

  return str;
}

// string -> buffer
var textEncode =
  typeof TextEncoder === "function"
    ? TextEncoder.prototype.encode.bind(new TextEncoder())
    : stringEncode;

// buffer -> string
var textDecode =
  typeof TextDecoder === "function"
    ? TextDecoder.prototype.decode.bind(new TextDecoder())
    : stringDecode;

var viewClasses = [
  "[object Int8Array]",
  "[object Uint8Array]",
  "[object Uint8ClampedArray]",
  "[object Int16Array]",
  "[object Uint16Array]",
  "[object Int32Array]",
  "[object Uint32Array]",
  "[object Float32Array]",
  "[object Float64Array]",
];

var isArrayBufferView =
  ArrayBuffer.isView ||
  function (obj) {
    return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
  };

function isDataView(obj) {
  return obj && Object.prototype.isPrototypeOf.call(DataView, obj);
}

function bufferClone(buf) {
  var view = new Array(buf.byteLength);
  var array = new Uint8Array(buf);
  var i = view.length;
  while (i--) {
    view[i] = array[i];
  }
  return view;
}

function concatTypedarrays(chunks) {
  var size = 0;
  var j = chunks.length;
  while (j--) {
    size += chunks[j].length;
  }
  var b = new Uint8Array(size);
  var offset = 0;
  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i];
    b.set(chunk, offset);
    offset += chunk.byteLength || chunk.length;
  }

  return b;
}

function MockBlob(chunks, opts) {
  chunks = chunks || [];
  opts = opts == null ? {} : opts;
  for (var i = 0, len = chunks.length; i < len; i++) {
    var chunk = chunks[i];
    if (chunk instanceof MockBlob) {
      chunks[i] = chunk._buffer;
    } else if (typeof chunk === "string") {
      chunks[i] = textEncode(chunk);
    } else if (
      Object.prototype.isPrototypeOf.call(ArrayBuffer, chunk) ||
      isArrayBufferView(chunk)
    ) {
      chunks[i] = bufferClone(chunk);
    } else if (isDataView(chunk)) {
      chunks[i] = bufferClone(chunk.buffer);
    } else {
      chunks[i] = textEncode(String(chunk));
    }
  }

  this._buffer = global.Uint8Array
    ? concatTypedarrays(chunks)
    : [].concat.apply([], chunks);
  this.size = this._buffer.length;

  this.type = opts.type || "";
  if (/[^\u0020-\u007E]/.test(this.type)) {
    this.type = "";
  } else {
    this.type = this.type.toLowerCase();
  }
}

MockBlob.prototype.arrayBuffer = function () {
  return Promise.resolve(this._buffer.buffer || this._buffer);
};

MockBlob.prototype.text = function () {
  return Promise.resolve(textDecode(this._buffer));
};

MockBlob.prototype.slice = function (start, end, type) {
  var slice = this._buffer.slice(start || 0, end || this._buffer.length);
  return new MockBlob([slice], { type: type });
};

MockBlob.prototype.toString = function () {
  return "[object Blob]";
};

function array2base64(input) {
  var byteToCharMap =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  var output = [];

  for (var i = 0; i < input.length; i += 3) {
    var byte1 = input[i];
    var haveByte2 = i + 1 < input.length;
    var byte2 = haveByte2 ? input[i + 1] : 0;
    var haveByte3 = i + 2 < input.length;
    var byte3 = haveByte3 ? input[i + 2] : 0;

    var outByte1 = byte1 >> 2;
    var outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
    var outByte3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
    var outByte4 = byte3 & 0x3f;

    if (!haveByte3) {
      outByte4 = 64;

      if (!haveByte2) {
        outByte3 = 64;
      }
    }

    output.push(
      byteToCharMap[outByte1],
      byteToCharMap[outByte2],
      byteToCharMap[outByte3],
      byteToCharMap[outByte4]
    );
  }

  return output.join("");
}

function mockCreateObjectURL(blob) {
  if (blob instanceof MockBlob) {
    return "data:" + blob.type + ";base64," + array2base64(blob._buffer);
  } else {
    console.error("MOCK ERROR ! Bad Blob type:", typeof blob);
  }
}

exports.MockBlob = MockBlob;
exports.mockCreateObjectURL = mockCreateObjectURL;
