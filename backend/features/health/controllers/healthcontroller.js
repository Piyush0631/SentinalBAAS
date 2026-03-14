const healthController = {
  getHealthStatus(request, response) {
    response.status(200).json({
      success: true,
      message: "Server running",
    });
  },
};

export default healthController;
