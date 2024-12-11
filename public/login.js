
const mensajeError = document.getElementsByClassName("error")[0];
document.getElementById("login-form").addEventListener("submit",async(e)=>{
    //Previene lo que hace por defecto
    e.preventDefault();
    
    const res = await fetch("/api/login",{
        method: "POST",
        headers:{
            "Content-Type" : "application/json"
        },
        body: JSON.stringify({
            email: e.target.children.email.value,
            password: e.target.children.password.value
        })
    })

    if(!res.ok) return mensajeError.classList.toggle("escondido",false);
    const resJson = await res.json();
    
    if(resJson.redirect){
        window.location.href = resJson.redirect;
    }
})
