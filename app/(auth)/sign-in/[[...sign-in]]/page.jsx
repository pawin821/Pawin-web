import { SignIn } from "@clerk/nextjs";
import {PawPrint} from "lucide-react"
export default function Page() {
  
  return(
    <section class="bg-white">
  <div class="lg:grid lg:min-h-screen lg:grid-cols-12">
    <section class="relative flex h-32 items-end bg-gray-900 lg:col-span-5 lg:h-full xl:col-span-6">
      <img
        alt=""
        src="http://images.unsplash.com/photo-1594499468121-f45e83e30df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMjA3fDB8MXxzZWFyY2h8MXx8ZG9nJTIwcGVyc29ufHwwfHx8fDE2MzEwNTA5ODE&ixlib=rb-1.2.1&q=80&w=1080"
        class="absolute inset-0 h-full w-full object-cover opacity-80"
      />

      <div class="hidden lg:relative lg:block lg:p-12">


        <h2 class="mt-6 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
           Welcome back to Pawin
        </h2>

        <p class="mt-4 leading-relaxed text-white/90">
           Login for free
        </p>
      </div>
    </section>

    <main
      class="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6"
    >
      <div class="max-w-xl lg:max-w-3xl">
        <div class="relative -mt-16 block lg:hidden">


          <h1 class="mt-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                       Welcome back to Pawin

          </h1>

          <p class="mt-4 leading-relaxed text-gray-500">
             Login for free
          </p>
        </div>
<SignIn />;
     
      </div>
    </main>
  </div>
</section>
  ) 
}//https://i.pinimg.com/736x/47/ff/93/47ff934cfb7ec2227f6b2f2e0c7ed072.jpg