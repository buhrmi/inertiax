require "application_system_test_case"

class ActiveStateTest < ApplicationSystemTestCase

  test 'basic nav' do
    visit '/'
    assert_text 'On Page 1'
    click_on 'Go to Page 2'
    assert_text 'On Page 2'
    click_on 'Go to Page 3'
    assert_text 'On Page 3'
  end
end
