async function apiRequest(path,options){const r=await fetch(path,Object.assign({headers:{"Content-Type":"application/json"},cache:"no-store"},options||{}));let x={};try{x=await r.json()}catch{}if(!r.ok)throw Error(x.error||"Request failed");return x}
async function getItems(){return apiRequest("/api/items")}
async function saveItem(item,password){return apiRequest("/api/items",{method:"POST",headers:{"Content-Type":"application/json","x-admin-password":password},body:JSON.stringify({item})})}
async function deleteItem(id,password){return apiRequest("/api/items/"+encodeURIComponent(id),{method:"DELETE",headers:{"x-admin-password":password}})}
async function clearItems(password){return apiRequest("/api/items",{method:"DELETE",headers:{"x-admin-password":password}})}
async function addVoucher(id,name,amount){return apiRequest("/api/items/"+encodeURIComponent(id)+"/vouchers",{method:"POST",body:JSON.stringify({name,amount})})}
