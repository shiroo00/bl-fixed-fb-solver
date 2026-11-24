import './style.css';

console.log('BL-fixed FB solver loaded aaa');
const response = await fetch(
    `${import.meta.env.BASE_URL}bins/fb-dist.bin`
);
const buffer = await response.arrayBuffer();
const data = new Uint8Array(buffer);

console.log(data);
console.log('length:', data.length);
console.log('first 20:', [...data.slice(1000000, 1000020)]);