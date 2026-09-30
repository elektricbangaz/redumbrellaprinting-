"use client";
import { useState } from "react";

export function ProductImage({src,alt,className}:{src?:string;alt:string;className?:string}){
  const [current,setCurrent]=useState(src||"/android-chrome-512x512.png");
  return <img className={className} src={current} alt={alt} onError={()=>setCurrent("/android-chrome-512x512.png")}/>;
}
