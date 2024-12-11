document.getElementById("closeProfile").addEventListener("click",()=>{
    document.cookie = 'jwt=; path=/; Expires=thu,01 Jan 1970 00:00:01 GTM;'
    document.location.href = "/"
})


