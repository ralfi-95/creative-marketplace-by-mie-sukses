export function validMediaSignature(bytes:Buffer){
 return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||
  (bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217)||
  (bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')||
  bytes.toString('ascii',0,5)==='%PDF-'||
  bytes.toString('ascii',0,4)==='PK\x03\x04'||
  bytes.subarray(0,8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
}

export function validOfficeDocument(bytes:Buffer,mime:string){
 if(mime==='application/msword')return bytes.subarray(0,8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
 return mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'&&bytes.subarray(0,4).toString('ascii')==='PK\x03\x04'&&bytes.includes(Buffer.from('word/document.xml'));
}

export function canUploadDeliverable(role:string,actorId:string,sellerId:string,status:string){
 return role==='seller'&&actorId===sellerId&&status==='in_progress';
}

export function canReadDeliverable(actorId:string,ownerId:string,hasAuthorizedOrder:boolean){
 return actorId===ownerId||hasAuthorizedOrder;
}
