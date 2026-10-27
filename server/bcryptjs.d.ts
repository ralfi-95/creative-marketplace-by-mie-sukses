declare module 'bcryptjs' {
 const bcrypt:{hash(password:string,saltOrRounds:number|string):Promise<string>;compare(password:string,hash:string):Promise<boolean>};
 export default bcrypt;
}
