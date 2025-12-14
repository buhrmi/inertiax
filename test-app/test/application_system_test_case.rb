require "test_helper"


class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  options = ENV["GITHUB_WORKFLOW"] ? {
    headless: true,
    no_sandbox: true,
    disable_dev_shm_usage: true
  } : {
    headless: true
  }

  options.merge! js_errors: true

  driven_by :cuprite, using: :chromium, screen_size: [ 500, 900 ], options: options
end
