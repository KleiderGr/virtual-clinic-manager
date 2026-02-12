import{u as s}from"./skeleton-234Dmda6.js";import{s as t}from"./index-DJ9E0Ydt.js";function u(){return s({queryKey:["patients"],queryFn:async()=>{const{data:e,error:r}=await t.from("profiles").select(`
          *,
          user_roles!inner(role)
        `).eq("user_roles.role","patient").order("created_at",{ascending:!1});if(r)throw r;return e}})}function f(e){return s({queryKey:["patients",e],queryFn:async()=>{if(!e)throw new Error("Patient ID is required");const{data:r,error:a}=await t.from("profiles").select("*").eq("id",e).single();if(a)throw a;const{data:o,error:n}=await t.from("appointments").select("id, appointment_date, start_time, status").eq("patient_id",e).order("appointment_date",{ascending:!1});if(n)throw n;return{...r,appointments:o||[]}},enabled:!!e})}export{f as a,u};
