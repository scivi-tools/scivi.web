// function arrayToAscii(array, start, length)
// {
//     var str = "";
//     for (var i = 0; i<length; i++)
//     {
//         str += String.fromCharCode(array[start+i]);
//     }
//     return str.trim();
// }
//
// function flipBits(n)
// {
//     return parseInt(n.toString(2).split('').map(bit => 1 - bit).join(''),2)
// }
//
// class EDF
// {
//     constructor(uint8array)
//     {
//         var pos = 0;
//
//         var buf = uint8array;
//         this.bytes = uint8array;
//
//         this.header = arrayToAscii(buf, pos, 8); pos += 8;
//         this.patient = arrayToAscii(buf, pos, 80); pos += 80;
//         this.info = arrayToAscii(buf, pos, 80); pos += 80;
//         this.date = arrayToAscii(buf, pos, 8); pos += 8;
//         this.time = arrayToAscii(buf, pos, 8); pos += 8;
//         this.header_bytes = arrayToAscii(buf, pos, 8); pos += 8;
//         this.data_format = arrayToAscii(buf, pos, 44); pos += 44;
//         this.data_records = parseInt(arrayToAscii(buf, pos, 8)); pos += 8;
//         this.data_record_duration = parseFloat(arrayToAscii(buf, pos, 8)); pos += 8;
//         this.channelCount = parseInt(arrayToAscii(buf, pos, 4)); pos += 4;
//
//         this.duration = this.data_record_duration*this.data_records;
//         this.bytes_per_sample = this.header == "0" ? 2 : 3;
//         this.has_annotations = false;
//
//         var n = this.channelCount;
//
//
//
//         this.channels = [];
//         for (var i = 0; i<n; i++)
//         {
//             var channel = new Object();
//             channel.label = arrayToAscii(buf, pos, 16); pos += 16;
//             channel.data = [];
//
//
//             if (channel.label.indexOf("DF Annotations")>0)
//             {
//                 this.has_annotations = true;
//
//             }
//             this.channels.push(channel);
//         }
//
//
//
//         this.realChannelCount = n;
//         if (this.has_annotations)
//         {
//             this.realChannelCount --;
//         }
//
//         this.annotation_bytes = 0;
//
//
//
//         for (var i = 0; i<n; i++)
//         {
//             this.channels[i].transducer = arrayToAscii(buf, pos, 80); pos += 80;
//         }
//
//         for (var i = 0; i<n; i++)
//         {
//             this.channels[i].dimensions = arrayToAscii(buf, pos, 8); pos += 8;
//         }
//
//         for (var i = 0; i<n; i++)
//         {
//             this.channels[i].phys_min = parseInt(arrayToAscii(buf, pos, 8)); pos += 8;
//         }
//
//         for (var i = 0; i<n; i++)
//         {
//             this.channels[i].phys_max = parseInt(arrayToAscii(buf, pos, 8)); pos += 8;
//         }
//
//         for (var i = 0; i<n; i++)
//         {
//             this.channels[i].digital_min = parseInt(arrayToAscii(buf, pos, 8)); pos += 8;
//         }
//
//         for (var i = 0; i<n; i++)
//         {
//             this.channels[i].digital_max = parseInt(arrayToAscii(buf, pos, 8)); pos += 8;
//         }
//
//         for (var i = 0; i<n; i++)
//         {
//             this.channels[i].prefilters = arrayToAscii(buf, pos, 80); pos += 80;
//         }
//
//         for (var i = 0; i<n; i++)
//         {
//             this.channels[i].num_samples = parseInt(arrayToAscii(buf, pos, 8)); pos += 8;
//             if (this.has_annotations && i == this.realChannelCount)
//             {
//                 this.annotation_bytes = this.channels[i].num_samples*2;
//             }
//         }
//
//         for (var i = 0; i<n; i++)
//         {
//             /*edf["channels"][i].reserved = arrayToAscii(buf, pos, 32);*/
//             this.channels[i].k = (this.channels[i].phys_max - this.channels[i].phys_min)/(this.channels[i].digital_max - this.channels[i].digital_min);
//
//             pos += 32;
//         }
//
//
//         this.sampling_rate = this.channels[0].num_samples*this.data_record_duration;
//         this.sample_size = 0;
//
//
//
//         if (this.has_annotations)
//         {
//             this.sample_size = (n-1)*2*this.sampling_rate + 60*2;
//         }
//         else
//         {
//             this.sample_size = (n)*2*this.sampling_rate;
//         }
//
//         var duration = (buf.length - pos)/this.sample_size;
//
//         this.headerOffset = pos;
//
//         this.samples_in_one_data_record = this.sampling_rate*this.data_record_duration;
//
//
//         for (var j = 0; j<this.data_records; j++)
//         {
//             for (var i = 0; i<this.realChannelCount; i++)
//             {
//                 var koef = this.channels[i].k;
//
//
//                 for (var k = 0; k<this.samples_in_one_data_record; k++)
//                 {
//                     if (this.bytes_per_sample == 2)
//                     {
//                         var b1 = buf[pos]; pos++;
//                         var b2 = buf[pos]; pos++;
//
//                         var val = (b2 << 8) + b1;
//
//                         if (b2 >> 7 == 1)
//                         {
//                             val = -flipBits(val)-1;
//                         }
//                         this.channels[i].data.push(val*koef);
//                     }
//                     else if (this.bytes_per_sample == 3)
//                     {
//                         var b1 = buf[pos]; pos++;
//                         var b2 = buf[pos]; pos++;
//                         var b3 = buf[pos]; pos++;
//
//                         var val = (b3 << 16) + (b2 << 8) + b1;
//
//                         if (b3 >> 7 == 1)
//                         {
//                             val = -flipBits(val)-1;
//                         }
//                         this.channels[i].data.push(val*koef);
//                     }
//                 }
//             }
//
//             if (this.has_annotations)
//             {
//                 var ann = arrayToAscii(buf, pos, this.annotation_bytes); pos+=this.annotation_bytes;
//
//             }
//         }
//
//     }
//
//     readSingleChannel(channel, startSecond, lengthSeconds)
//     {
//         var startSample = startSecond*this.sampling_rate;
//         var endSample = startSample + lengthSeconds*this.sampling_rate;
//
//         if (endSample > this.maxSample)
//         {
//             endSample = this.maxSample;
//         }
//
//         var data = [];
//
//         var ch = this.channels[channel].data;
//         for (var i = startSample; i<endSample; i++)
//         {
//             data.push(ch[i]);
//         }
//
//         return data;
//     }
//
//
//     read(startSecond, lengthSeconds)
//     {
//         var array = [];
//
//
//
//         for (var i = 0; i<this.realChannelCount; i++)
//         {
//             array.push(this.readSingleChannel(i, startSecond, lengthSeconds));
//         }
//
//         return array;
//     }
//
//
// }

!function(e){var t={};function r(n){if(t[n])return t[n].exports;var s=t[n]={i:n,l:!1,exports:{}};return e[n].call(s.exports,s,s.exports,r),s.l=!0,s.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)r.d(n,s,function(t){return e[t]}.bind(null,s));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=2)}([function(e,t){e.exports={toString:function(e){return String(e).trim()},string_from_buffer:function(e,t,r){const n=new Uint8Array(e,t,r-t);return String.fromCharCode.apply(null,n)},assert:function(e,t=""){if(!e)throw"Assertion Error: "+t},parseDateTime:function(e,t,r){let n,s,i,l,a,o,h;if(r=r||"20",e.includes("-")?(n=(e=e.split("-"))[0],s=e[1],i=e[2]):e.includes("/")?(n=(e=e.split("/"))[2],s=e[0],i=e[1]):e.includes(".")&&(n=(e=e.split("."))[2],s=e[1],i=e[0]),s-=1,2==n.length&&(n=r+n),l=(t=t.replace(/\./g,":").split(":"))[0],a=t[1],o=t[2],h=t[3],h&&3!=h.length){for(let e=0;e<3-h.length;e++)h+="0";h=h.substring(0,4)}return new Date(Date.UTC(n,s,i,l,a,o,h||0))}}},function(e,t,r){"use strict";const n=r(0).toString;e.exports=class{constructor(){this.fields={label:[n,16],channel_type:[n,80],physical_dimension:[n,8],physical_minimum:[Number,8],physical_maximum:[Number,8],digital_minimum:[Number,8],digital_maximum:[Number,8],prefiltering:[n,80],num_samples_per_record:[Number,8],reserved:[n,32]}}init(e,t){if(null==this.num_samples_per_record)throw"init called on uninitialized channel";this.blob=new Float32Array(e*this.num_samples_per_record),this.scale=(this.physical_maximum-this.physical_minimum)/(this.digital_maximum-this.digital_minimum),this.offset=this.physical_maximum/this.scale-this.digital_maximum,this.sampling_rate=this.num_samples_per_record/t}digital2physical(e){return this.scale*(e+this.offset)}set_record(e,t){const r=e*this.num_samples_per_record;for(var n=0;n<this.num_samples_per_record;n++)this.blob[r+n]=this.digital2physical(t[n])}get_physical_samples(e,t,r){r=r||t*this.sampling_rate;const n=e*this.sampling_rate;return this.blob.slice(n,n+r)}}},function(e,t,r){"use strict";(function(t){const n=r(4),s=r(0),i={EDF:n,Channel:r(1),string_from_buffer:s.string_from_buffer};e.exports=i,t.edfjs=i}).call(this,r(3))},function(e,t){var r;r=function(){return this}();try{r=r||new Function("return this")()}catch(e){"object"==typeof window&&(r=window)}e.exports=r},function(e,t,r){"use strict";const n=r(0),s=r(1),i=n.toString;e.exports=class{constructor(){this.fields={version:[i,8],pid:[i,80],rid:[i,80],startdate:[i,8],starttime:[i,8],num_header_bytes:[Number,8],reserved:[i,44],num_records:[Number,8],record_duration:[Number,8],num_channels:[Number,4]},this.header_bytes=256,this.bytes_per_sample=2,this.channels=[]}get_physical_samples(e=0,t=null,r=null,n=null){if(null===e&&(e=0),null===t&&null===n&&(t=this.duration),null===r){r=[];for(let e in this.channel_by_label)r.push(e)}return new Promise(s=>{const i={};for(let s of r){const r=this.channel_by_label[s];i[s]=r.get_physical_samples(e,t,n)}s(i)})}from_file(e,t=!1){return new Promise(r=>{const n=new FileReader;this.filename=e.name,n.onload=e=>{this.read_buffer(e.target.result,t),r(this)},n.readAsArrayBuffer(e)})}relative_date(e){return new Date(this.relative_time(e))}read_buffer(e,t=!1){const r=n.string_from_buffer(e,0,this.header_bytes);if(this.read_header_from_string(r),0==this.num_channels)return null;const s=n.string_from_buffer(e,this.header_bytes,this.num_header_bytes);this.read_channel_header_from_string(s),this.check_blob_size(e),t||this.read_blob_from_buffer(e)}read_header_from_string(e){let t=0;for(let r in this.fields){const n=this.fields[r][0],s=t+this.fields[r][1];this[r]=n(e.substring(t,s)),t=s}this.startdatetime=n.parseDateTime(this.startdate,this.starttime)}read_channel_header_from_string(e){if(0===this.num_channels)return;for(let e=0;e<this.num_channels;e++)this.channels.push(new s);let t=0;const r=this.channels[0].fields;for(let n in r){const s=r[n][0],i=r[n][1];for(let r=0;r<this.num_channels;r++){const l=t+i;this.channels[r][n]=s(e.substring(t,l)),t=l}}this.channel_by_label={};for(let e of this.channels)this.channel_by_label[e.label]=e}check_blob_size(e){let t=0;for(let e=0;e<this.num_channels;e++)t+=this.channels[e].num_samples_per_record;const r=t*this.num_records,s=(e.byteLength-this.num_header_bytes)/2;return this.duration=this.record_duration*s/t,n.assert(s==r,`Header implies ${r} samples; ${s} found.`),s}read_blob_from_buffer(e){let t=[0];for(let e=0;e<this.num_channels;e++)t.push(t[e]+this.channels[e].num_samples_per_record);const r=t[this.channels.length];let n=null;try{n=this.check_blob_size(e)}catch(t){n=(e.byteLength-this.num_header_bytes)/this.bytes_per_sample}const s=new Int16Array(e,this.num_header_bytes,n);for(let e=0;e<this.num_channels;e++)this.channels[e].init(this.num_records,this.record_duration);for(let e=0;e<this.num_records;e++)for(let n=0;n<this.num_channels;n++)this.channels[n].set_record(e,s.slice(e*r+t[n],e*r+t[n+1]));this.sampling_rate={};for(let e in this.channel_by_label){const t=this.channel_by_label[e];this.sampling_rate[e]=t.sampling_rate}}relative_time(e){return this.startdatetime.getTime()+e}}}]);
