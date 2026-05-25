using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Services.VolunteerHub;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/channels")]
    [ApiController]
    [Authorize]
    public class ChannelsController : ControllerBase
    {
        private readonly IChannelService _channelService;

        public ChannelsController(IChannelService channelService)
        {
            _channelService = channelService;
        }

        private int? GetUserId() =>
            int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();

            var channels = await _channelService.GetAllAsync();
            var accessibleChannels = new List<BaseCore.Entities.Channel>();
            foreach (var channel in channels)
            {
                if (await _channelService.CanAccessChannelAsync(channel.Id, uid.Value))
                    accessibleChannels.Add(channel);
            }

            return Ok(accessibleChannels);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                return Forbid();
            var channel = await _channelService.GetByIdAsync(id, uid.Value);
            return channel == null ? NotFound() : Ok(channel);
        }

        // POSTS
        [HttpGet("{id}/posts")]
        public async Task<IActionResult> GetPosts(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? type = null)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                return Forbid();
            var (items, totalCount) = await _channelService.GetPostsAsync(id, page, pageSize, uid.Value, type);
            return Ok(new { items, totalCount, page, pageSize, totalPages = (int)Math.Ceiling((double)totalCount / pageSize) });
        }

        [HttpPost("{id}/posts")]
        public async Task<IActionResult> CreatePost(int id, [FromBody] PostCreateDto dto)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                return Forbid();
            try
            {
                var post = await _channelService.CreatePostAsync(id, uid.Value, dto.Content, dto.ImageUrl, dto.PostType, dto.Attachment);
                return Ok(post);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{id}/posts/{postId}")]
        public async Task<IActionResult> UpdatePost(int id, int postId, [FromBody] PostCreateDto dto)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            try
            {
                if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                    return Forbid();
                await _channelService.UpdatePostAsync(id, postId, uid.Value, dto.Content, dto.ImageUrl);
                return Ok(new { message = "Updated" });
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("{id}/posts/{postId}")]
        public async Task<IActionResult> DeletePost(int id, int postId)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            try
            {
                if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                    return Forbid();
                await _channelService.DeletePostAsync(id, postId, uid.Value, false);
                return Ok(new { message = "Deleted" });
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("{id}/posts/{postId}/like")]
        public async Task<IActionResult> ToggleLike(int id, int postId)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            try
            {
                if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                    return Forbid();
                var liked = await _channelService.ToggleLikeAsync(id, postId, uid.Value);
                return Ok(new { liked });
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("{id}/posts/{postId}/toggle-pin")]
        public async Task<IActionResult> TogglePin(int id, int postId)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            try
            {
                if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                    return Forbid();
                var post = await _channelService.TogglePinAsync(id, postId, uid.Value, false);
                return Ok(post);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("{id}/members")]
        public async Task<IActionResult> GetChannelMembers(int id, [FromQuery] string? query = null)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                return Forbid();
            try
            {
                return Ok(await _channelService.GetChannelMembersAsync(id, query));
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        // COMMENTS
        [HttpGet("{id}/posts/{postId}/comments")]
        public async Task<IActionResult> GetComments(int id, int postId)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                return Forbid();
            try
            {
                var comments = await _channelService.GetCommentsAsync(id, postId);
                return Ok(comments);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("{id}/posts/{postId}/comments")]
        public async Task<IActionResult> AddComment(int id, int postId, [FromBody] CommentDto dto)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                return Forbid();
            try
            {
                var comment = await _channelService.AddCommentAsync(id, postId, uid.Value, dto.Content, dto.ParentCommentId);
                return Ok(comment);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("{id}/posts/{postId}/comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int id, int postId, int commentId)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            try
            {
                if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                    return Forbid();
                await _channelService.DeleteCommentAsync(id, postId, commentId, uid.Value, false);
                return Ok(new { message = "Deleted" });
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("{id}/posts/{postId}/poll")]
        public async Task<IActionResult> CreatePoll(int id, int postId, [FromBody] PollCreateDto dto)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            try
            {
                if (!await _channelService.CanAccessChannelAsync(id, uid.Value))
                    return Forbid();
                var poll = await _channelService.CreatePollAsync(id, postId, uid.Value, false, dto);
                return Ok(poll);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("{id}/polls/{pollId}/vote")]
        public async Task<IActionResult> VotePoll(int id, int pollId, [FromBody] PollVoteDto dto)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            try
            {
                var poll = await _channelService.VoteAsync(id, pollId, dto.OptionId, uid.Value);
                return Ok(poll);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("{id}/polls/{pollId}/results")]
        public async Task<IActionResult> GetPollResults(int id, int pollId)
        {
            var uid = GetUserId();
            if (uid == null) return Unauthorized();
            try
            {
                return Ok(await _channelService.GetPollResultsAsync(id, pollId, uid.Value));
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }
    }

    public class PostCreateDto
    {
        public string Content { get; set; } = "";
        public string? ImageUrl { get; set; }
        public string PostType { get; set; } = "discussion";
        public AttachmentDto? Attachment { get; set; }
    }

    public class CommentDto
    {
        public string Content { get; set; } = "";
        public int? ParentCommentId { get; set; }
    }

    public class PollVoteDto
    {
        public int OptionId { get; set; }
    }
}
