export const waRuntime = {
  sessions: new Map()
}

/*
 key   : botPhoneNumber
 value : {
   sock,
   status: 'connecting' | 'connected' | 'disconnected',
   user: {
     wid,
     pushname
   }
 }
*/
