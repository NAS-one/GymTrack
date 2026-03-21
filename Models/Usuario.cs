namespace Gymtrack_BD.Models
{
    public class Usuario
    {
        public int Id { get; set; } // Entity Framework sabrá que esta es la llave primaria automática.
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty; // ¡Nota: Después la encriptaremos!
        public string Rol { get; set; } = "Cliente"; // Puede ser Admin, Entrenador, Cliente
        public DateTime FechaRegistro { get; set; } = DateTime.Now;
    }
}