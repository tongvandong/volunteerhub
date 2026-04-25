using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.APIService.Controllers
{
    [Route("api/event-categories")]
    [ApiController]
    public class EventCategoriesController : ControllerBase
    {
        private readonly IEventCategoryRepositoryEF _repo;
        public EventCategoriesController(IEventCategoryRepositoryEF repo) => _repo = repo;

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _repo.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _repo.GetByIdAsync(id);
            return item == null ? NotFound() : Ok(item);
        }

        [HttpPost, Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] EventCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Category name is required" });

            var cat = new EventCategory
            {
                Name = dto.Name.Trim(),
                Description = dto.Description ?? "",
                Icon = dto.Icon ?? ""
            };
            await _repo.AddAsync(cat);
            return CreatedAtAction(nameof(GetById), new { id = cat.Id }, cat);
        }

        [HttpPut("{id}"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] EventCategoryDto dto)
        {
            var cat = await _repo.GetByIdAsync(id);
            if (cat == null) return NotFound();
            if (dto.Name != null && string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Category name cannot be empty" });

            cat.Name = dto.Name?.Trim() ?? cat.Name;
            cat.Description = dto.Description ?? cat.Description;
            cat.Icon = dto.Icon ?? cat.Icon;
            await _repo.UpdateAsync(cat);
            return Ok(cat);
        }

        [HttpDelete("{id}"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var cat = await _repo.GetByIdAsync(id);
            if (cat == null) return NotFound();
            await _repo.DeleteAsync(cat);
            return Ok(new { message = "Deleted" });
        }
    }

    public class EventCategoryDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public string? Icon { get; set; }
    }
}
