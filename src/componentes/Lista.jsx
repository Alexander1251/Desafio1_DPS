import React from "react";
import { data } from "../app/data";

export const Lista = () => {
    return (




        <div className="container">
            <div className="titulo"><h1>{data[0].descripcion}</h1></div>
            {data[0].empresas.map( (item, indice)=> (
                <div key={indice+1}>
                    <h1>{item.titulo}</h1>
                    <div className="descripcion">
                        <div className="des-parrafo">
                        <p><b>Descripción: </b>{item.descripcion}</p>
                        </div>
                        <div className="image-container">
                            <img src={item.imagen} alt="" />
                        </div>
                    </div>
                    <div className="caracteristicas">
                        <p><b>Características: </b>{item.caracteristicas}</p>
                    </div>

                </div>
            ))}

        </div>




    );
}
