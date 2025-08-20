const Blog = require('../database/models/blogModel');

// Get all blogs (admin)
const getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const updatedBlogs = await Promise.all(
      blogs.map(async (blog) => {
        if (!blog.likes) {
          blog.likes = [];
          await blog.save();
        }
        return blog;
      })
    );

    const total = await Blog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: updatedBlogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting blogs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get published blogs (public)
const getPublishedBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await Blog.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const updatedBlogs = await Promise.all(
      blogs.map(async (blog) => {
        if (!blog.likes) {
          blog.likes = [];
          await blog.save();
        }
        return blog;
      })
    );

    const total = await Blog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: updatedBlogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting published blogs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get blog by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const { incrementViews = false } = req.query;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    if (incrementViews === 'true') {
      blog.views += 1;
      await blog.save();
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error('Error getting blog:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get blog by slug (public)
const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { incrementViews = false } = req.query;

    const blog = await Blog.findOne({ slug, status: 'published' });
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    if (incrementViews === 'true') {
      blog.views += 1;
      await blog.save();
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error('Error getting blog by slug:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle like on blog
const toggleBlogLike = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const existingLike = blog.likes.find((like) => like.userEmail === userEmail);

    if (existingLike) {
      blog.likes = blog.likes.filter((like) => like.userEmail !== userEmail);
    } else {
      blog.likes.push({ userEmail, likedAt: new Date() });
    }

    await blog.save();

    res.json({
      success: true,
      message: existingLike ? 'Like removed' : 'Blog liked',
      data: { liked: !existingLike, likeCount: blog.likes.length }
    });
  } catch (error) {
    console.error('Toggle blog like error:', error);
    res.status(500).json({ success: false, message: 'Error toggling like', error: error.message });
  }
};

// Create new blog
const createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      author,
      status,
      featuredImage,
      metaTitle,
      metaDescription,
      featured,
      allowComments
    } = req.body;

    const existingBlog = await Blog.findOne({ title });
    if (existingBlog) {
      return res.status(400).json({ success: false, message: 'A blog with this title already exists' });
    }

    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter((tag) => tag && tag.trim().length > 0);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
      }
    }

    const blog = new Blog({
      title,
      content,
      excerpt,
      category,
      tags: processedTags,
      author,
      status,
      featuredImage,
      metaTitle,
      metaDescription,
      featured,
      allowComments
    });

    await blog.save();

    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update blog
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.title) {
      const existingBlog = await Blog.findOne({ title: updateData.title, _id: { $ne: id } });
      if (existingBlog) {
        return res.status(400).json({ success: false, message: 'A blog with this title already exists' });
      }
    }

    if (updateData.tags) {
      if (Array.isArray(updateData.tags)) {
        updateData.tags = updateData.tags.filter((tag) => tag && tag.trim().length > 0);
      } else if (typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0);
      }
    }

    const blog = await Blog.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.status(200).json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete blog
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.status(200).json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get blog statistics
const getBlogStats = async (req, res) => {
  try {
    const stats = await Blog.aggregate([
      {
        $group: {
          _id: null,
          totalBlogs: { $sum: 1 },
          publishedBlogs: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          draftBlogs: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          totalViews: { $sum: '$views' },
          featuredBlogs: { $sum: { $cond: ['$featured', 1, 0] } }
        }
      }
    ]);

    const categoryStats = await Blog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentBlogs = await Blog.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalBlogs: 0,
          publishedBlogs: 0,
          draftBlogs: 0,
          totalViews: 0,
          featuredBlogs: 0
        },
        categoryStats,
        recentBlogs
      }
    });
  } catch (error) {
    console.error('Error getting blog stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload blog image (admin only)
const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const imagePath = `/uploads/images/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { imageUrl: imagePath }
    });
  } catch (error) {
    console.error('Error uploading blog image:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllBlogs,
  getPublishedBlogs,
  getBlogById,
  getBlogBySlug,
  toggleBlogLike,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogStats,
  uploadBlogImage
};
