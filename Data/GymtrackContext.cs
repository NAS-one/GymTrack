using Gymtrack_BD.Models; // Aquí le decimos dónde están nuestros modelos.
using Microsoft.EntityFrameworkCore; // Aquí le decimos cómo hablar con Entity Framework.

namespace Gymtrack_BD.Data
{
    public class GymtrackContext : DbContext
    {
        public GymtrackContext(DbContextOptions<GymtrackContext> options) : base(options)
        {
        }

        // Esta línea le dice a EF: "Quiero una tabla llamada 'Usuarios' basada en la clase 'Usuario'".
        public DbSet<Usuario> Usuarios { get; set; }
    }
}