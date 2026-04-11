import { Clientes } from "./Clientes";

export function MisAlumnos() {
  return (
    // ¡Llamamos a tu misma página de clientes, pero le avisamos que somos el Entrenador!
    <div className="pt-2">
      <Clientes modoEntrenador={true} />
    </div>
  );
}
