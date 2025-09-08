import React from "react"
export default class ErrorBoundary extends React.Component{
  constructor(p){ super(p); this.state={error:null} }
  static getDerivedStateFromError(error){ return {error} }
  componentDidCatch(error, info){ console.error("💥 ErrorBoundary caught:", error, info) }
  render(){
    if(this.state.error){
      return (
        <div style={{padding:"16px",fontFamily:"ui-sans-serif",color:"#b91c1c"}}>
          <h2 style={{fontWeight:800}}>App crashed</h2>
          <pre style={{whiteSpace:"pre-wrap",background:"#fee2e2",padding:"12px",borderRadius:"8px",overflow:"auto"}}>
{String(this.state.error?.message||this.state.error||"Unknown error")}
          </pre>
          <p style={{marginTop:8,fontSize:12,color:"#7f1d1d"}}>Open DevTools → Console for full stack.</p>
        </div>
      )
    }
    return this.props.children
  }
}
