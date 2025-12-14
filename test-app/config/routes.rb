Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  inertia "/" => "welcome"

  inertia "/page1" => "page1"
  inertia "/page2" => "page2"
  inertia "/page3" => "page3"
  inertia "/page4" => "page4"
end
